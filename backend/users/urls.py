from django.urls import path
from .views import (
    RegisterView, LoginView, UserDetailView, UpdateProfileView, 
    SystemConfigView, OnlineUserListView, UpdateEmailView, UpdatePasswordView,
    DailyPlanListView, DailyPlanDetailView, ResetEloView,
    ActivateMembershipView, ActivationCodeListView, ActivationCodeDetailView,
    BIAnalyticsView, WeeklyCognitiveReportView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('me/update/', UpdateProfileView.as_view(), name='user-update'),
    path('me/email/', UpdateEmailView.as_view(), name='email-update'),
    path('me/password/', UpdatePasswordView.as_view(), name='password-update'),
    path('config/', SystemConfigView.as_view(), name='system-config'),
    path('online/', OnlineUserListView.as_view(), name='online-users'),
    path('plans/', DailyPlanListView.as_view(), name='daily-plan-list'),
    path('plans/<int:pk>/', DailyPlanDetailView.as_view(), name='daily-plan-detail'),
    path('me/reset-elo/', ResetEloView.as_view(), name='reset-elo'),
    path('me/activate/', ActivateMembershipView.as_view(), name='activate-membership'),
    path('admin/codes/', ActivationCodeListView.as_view(), name='activation-codes'),
    path('admin/codes/<int:pk>/', ActivationCodeDetailView.as_view(), name='activation-code-detail'),
    path('admin/bi/', BIAnalyticsView.as_view(), name='admin-bi'),
    path('me/weekly-report/', WeeklyCognitiveReportView.as_view(), name='weekly-report'),
]
