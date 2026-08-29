from django.urls import path

from . import views

urlpatterns = [
    path(
        "conversations/",
        views.ConversationListView.as_view(),
        name="conversation-list",
    ),
    path(
        "conversations/<int:conversation_id>/",
        views.ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    path(
        "conversations/<int:conversation_id>/messages/",
        views.ConversationMessagesView.as_view(),
        name="conversation-messages",
    ),
    path(
        "messages/",
        views.ConversationMessagesView.as_view(),
        name="send-message",
    ),
]
