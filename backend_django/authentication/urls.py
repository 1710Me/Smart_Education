from django.urls import path
from . import views

urlpatterns = [
    path('sendotp/', views.send_otp, name='send_otp'),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('changepassword/', views.change_password, name='change_password'),
    path('reset-password-token/', views.reset_password_token, name='reset_password_token'),
    path('reset-password/', views.reset_password, name='reset_password'),
]