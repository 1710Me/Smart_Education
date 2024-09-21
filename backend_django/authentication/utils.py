import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def generate_password_reset_token():
    return str(uuid.uuid4())  # Convert UUID to string

def send_password_reset_email(user, reset_url):
    subject = 'Password Reset Link'
    message = f'Password Reset Link: {reset_url}'
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user['email']]  # Access email as dictionary key
    
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        logger.info(f"Password reset email sent to {user['email']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user['email']}: {str(e)}")
        return False

def password_updated_email(user):
    subject = 'Password Update Confirmation'
    message = f"""
    Hey {user['firstName']},

    Your password has been successfully updated for the email {user['email']}.

    If you did not request this password change, please contact us immediately to secure your account.

    If you have any questions or need further assistance, please feel free to reach out to us at info@studynotion.com. We are here to help!
    """
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user['email']]  # Access email as dictionary key
    
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        logger.info(f"Password update confirmation email sent to {user['email']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password update confirmation email to {user['email']}: {str(e)}")
        return False

def send_otp_email(email, otp):
    subject = 'OTP Verification Email'
    message = f'Your OTP is: {otp}'
    from_email = settings.EMAIL_HOST_USER
    recipient_list = [email]
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        logger.info(f"OTP email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False