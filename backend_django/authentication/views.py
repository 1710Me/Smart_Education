from db_connection import user_collection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User, OTP, Profile
import json
import bcrypt
import jwt
from django.conf import settings
import random
import datetime
from django.utils import timezone
from datetime import timedelta
from .utils import send_otp_email, generate_password_reset_token, send_password_reset_email, password_updated_email
from bson import ObjectId
from django.http import HttpResponse
import logging
from bson.errors import InvalidId
from bson import ObjectId
from datetime import datetime, timedelta

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

@csrf_exempt
def send_otp(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        
        if user_collection.find_one({'email': email}):
            return JsonResponse({'success': False, 'message': 'User is Already Registered'}, status=401)
        
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        OTP.objects.create(email=email, otp=otp)
        
        send_otp_email(email, otp)
        
        return JsonResponse({'success': True, 'message': 'OTP sent successfully'})

@csrf_exempt
def signup(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        otp = data.get('otp')
        
        recent_otp = OTP.objects.filter(email=email).order_by('-createdAt').first()
        
        if not recent_otp or recent_otp.otp != otp:
            return JsonResponse({'success': False, 'message': 'Invalid OTP'}, status=400)
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_data = {
            'email': email,
            'password': hashed_password,
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'accountType': data.get('accountType'),
            'contactNumber': data.get('contactNumber'),
            'approved': True,
            'image': f"https://api.dicebear.com/5.x/initials/svg?seed={data.get('firstName')} {data.get('lastName')}"
        }
        
        user_collection.insert_one(user_data)
        
        return JsonResponse({'success': True, 'message': 'User Registered Successfully'})

@csrf_exempt
def login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        user = user_collection.find_one({'email': email})
        
        if not user:
            return JsonResponse({'success': False, 'message': 'User not found'}, status=401)
        
        # Convert the stored password to bytes if it's a string
        stored_password = user['password'].encode('utf-8') if isinstance(user['password'], str) else user['password']
        
        if bcrypt.checkpw(password.encode('utf-8'), stored_password):
            payload = {
                'email': user['email'],
                'id': str(user['_id']),
                'accountType': user['accountType'],
                'exp': datetime.utcnow() + timedelta(days=1)
            }
            token = jwt.encode(payload, settings.JWT_SECRET.encode('utf-8'), algorithm='HS256')
            user.pop('password', None)
            user['_id'] = str(user['_id'])
            
            response_data = {
                'success': True,
                'user': user,
                'token': token,
                'message': 'User logged in successfully'
            }
            print('JWT_SECRET:', settings.JWT_SECRET)
            print('Generated token:', token)
            return HttpResponse(
                json.dumps(response_data, cls=JSONEncoder),
                content_type='application/json'
            )
        else:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
        
@csrf_exempt
def change_password(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        
        token = request.headers.get('Authorization').split(' ')[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user_id = ObjectId(payload['id'])
        
        user = user_collection.find_one({'_id': user_id})
        
        if not bcrypt.checkpw(old_password.encode('utf-8'), user['password']):
            return JsonResponse({'success': False, 'message': 'Old password is incorrect'}, status=401)
        
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user_collection.update_one({'_id': user_id}, {'$set': {'password': hashed_password}})
        
        return JsonResponse({'success': True, 'message': 'Password changed successfully'})
@csrf_exempt
def reset_password_token(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            
            user = user_collection.find_one({'email': email})
            if not user:
                return JsonResponse({'success': False, 'message': 'Your Email is not registered with us'}, status=404)
            
            token = generate_password_reset_token()
            expires = timezone.now() + timedelta(minutes=30)  # Increased to 30 minutes
            
            result = user_collection.update_one(
                {'_id': user['_id']},
                {'$set': {
                    'reset_password_token': token,
                    'reset_password_token_expires': expires
                }}
            )
            
            if result.modified_count != 1:
                logger.error(f"Failed to update reset token for user: {email}")
                return JsonResponse({'success': False, 'message': 'Failed to generate reset token'}, status=500)
            
            reset_url = f"https://study-notion-mern-stack.netlify.app/update-password/{token}"
            email_sent = send_password_reset_email(user, reset_url)
            
            if email_sent:
                logger.info(f"Password reset email sent to: {email}")
                return JsonResponse({'success': True, 'message': 'Email sent successfully, Please check your mail box and change password'})
            else:
                logger.error(f"Failed to send password reset email to: {email}")
                return JsonResponse({'success': False, 'message': 'Failed to send email. Please try again later.'}, status=500)

        except json.JSONDecodeError:
            logger.error("Invalid JSON in request body")
            return JsonResponse({'success': False, 'message': 'Invalid JSON in request body'}, status=400)
        except Exception as e:
            logger.error(f"Unexpected error in reset_password_token: {str(e)}")
            return JsonResponse({'success': False, 'message': f'Error while generating reset token: {str(e)}'}, status=500)

    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)
logger = logging.getLogger(__name__)

@csrf_exempt
def reset_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            token = data.get('token')
            password = data.get('password')
            confirm_password = data.get('confirmPassword')
            
            logger.info(f"Received reset password request with token: {token}")
            
            if not token or not password or not confirm_password:
                return JsonResponse({'success': False, 'message': 'All fields are required'}, status=400)
            
            if password != confirm_password:
                return JsonResponse({'success': False, 'message': 'Passwords do not match'}, status=400)
            
            user = user_collection.find_one({'reset_password_token': token})
            if not user:
                logger.warning(f"No user found with reset_password_token: {token}")
                return JsonResponse({'success': False, 'message': 'Invalid or expired token'}, status=400)
            
            logger.info(f"User found: {user['email']}")
            
            if 'reset_password_token_expires' not in user or user['reset_password_token_expires'] < timezone.now():
                logger.warning(f"Token expired for user: {user['email']}")
                return JsonResponse({'success': False, 'message': 'Token has expired, please request a new one'}, status=400)
            
            try:
                hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            except ValueError as e:
                logger.error(f"Error hashing password: {str(e)}")
                return JsonResponse({'success': False, 'message': 'Invalid password format'}, status=400)
            
            result = user_collection.update_one(
                {'_id': user['_id']},
                {
                    '$set': {'password': hashed_password},
                    '$unset': {'reset_password_token': "", 'reset_password_token_expires': ""}
                }
            )
            
            if result.modified_count == 1:
                logger.info(f"Password reset successfully for user: {user['email']}")
                password_updated_email(user)
                return JsonResponse({'success': True, 'message': 'Password reset successfully'})
            else:
                logger.error(f"Failed to update password for user: {user['email']}")
                return JsonResponse({'success': False, 'message': 'Failed to reset password'}, status=500)
        
        except json.JSONDecodeError:
            logger.error("Invalid JSON in request body")
            return JsonResponse({'success': False, 'message': 'Invalid JSON in request body'}, status=400)
        except InvalidId:
            logger.error("Invalid ObjectId format")
            return JsonResponse({'success': False, 'message': 'Invalid user ID format'}, status=400)
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
        except Exception as e:
            logger.error(f"Unexpected error in reset_password: {str(e)}")
            return JsonResponse({'success': False, 'message': f'Error while resetting password: {str(e)}'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)