import { useState } from 'react';
import { useMessages, useMarkMessageAsRead } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout';
import { Loader, Button, Modal } from '../components/common';
import { MessageComposer } from '../components/messaging/MessageComposer';
import { formatDistanceToNow } from '../utils/formatters';
import type { Message } from '../types';

export const Messages = () => {
  const { user } = useAuth();
  const { data: messagesData, isLoading, error } = useMessages();
  const markAsReadMutation = useMarkMessageAsRead();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const messages = messagesData?.data || [];

  // Calculate unread count
  const unreadCount = messages.filter(msg => !msg.is_read && msg.recipient_id === user?.id).length;

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    
    const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';
    const isPatientMessage = message.sender?.role === 'patient';
    
    // Mark as read if unread and:
    // - user is the direct recipient, OR
    // - user is staff/admin viewing a patient message
    const shouldMarkRead = !message.is_read && (
      message.recipient_id === user?.id ||
      (isStaffOrAdmin && isPatientMessage)
    );

    if (shouldMarkRead) {
      try {
        await markAsReadMutation.mutateAsync(message.id);
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const handleCloseMessageDetail = () => {
    setSelectedMessage(null);
  };

  const handleComposeSuccess = () => {
    setIsComposerOpen(false);
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-2 text-sm text-gray-600">
              Communicate with clinic staff
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => setIsComposerOpen(true)} className="w-full sm:w-auto">
            <svg className="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Message</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load messages. Please try again.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-gray-600">No messages yet</p>
            <Button onClick={() => setIsComposerOpen(true)} className="mt-4 w-full sm:w-auto">
              Send your first message
            </Button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {messages.map((message) => {
                const isRecipient = message.recipient_id === user?.id;
                const otherUser = isRecipient ? message.sender : message.recipient;
                const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';
                const patientSender = message.sender?.role === 'patient' ? message.sender : null;
                // For staff/admin, treat patient messages as "unread" if not read
                const isUnread = !message.is_read && (isRecipient || (isStaffOrAdmin && patientSender !== null));

                // For staff/admin: always show the patient sender's name (messages come from patients)
                // For patients: show "Clinic Staff" instead of the actual staff member's name
                const displayName = isStaffOrAdmin && patientSender
                  ? patientSender.name
                  : (user?.role === 'patient' && !isRecipient && otherUser?.role !== 'patient')
                    ? 'Clinic Staff'
                    : otherUser?.name || 'Unknown User';
                // For staff, label as "from" when message is from a patient
                const showFromLabel = isStaffOrAdmin && patientSender;

                return (
                  <li
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isUnread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                            {displayName}
                            {(isRecipient || showFromLabel) && (
                              <span className="ml-2 text-xs text-gray-500">
                                (from)
                              </span>
                            )}
                            {(!isRecipient && !showFromLabel) && (
                              <span className="ml-2 text-xs text-gray-500">
                                (to)
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2">
                            {isUnread && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                                New
                              </span>
                            )}
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDistanceToNow(message.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className={`mt-1 text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'} truncate`}>
                          {message.subject}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {message.content}
                        </p>
                        {message.attachment_path && (
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                              />
                            </svg>
                            Attachment
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <Modal
            isOpen={true}
            onClose={handleCloseMessageDetail}
            title="Message Details"
            size="lg"
          >
            <div className="space-y-3 sm:space-y-4">
              {/* Patient Details Card - shown to staff/admin when sender is a patient */}
              {(user?.role === 'staff' || user?.role === 'admin') && selectedMessage.sender?.role === 'patient' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Patient Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Name:</span>
                      <span className="ml-1 text-gray-900">{selectedMessage.sender.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Email:</span>
                      <span className="ml-1 text-gray-900 break-all">{selectedMessage.sender.email}</span>
                    </div>
                    {selectedMessage.sender.mobile && (
                      <div>
                        <span className="text-blue-600 font-medium">Phone:</span>
                        <span className="ml-1 text-gray-900">{selectedMessage.sender.mobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">From:</label>
                <p className="mt-1 text-sm text-gray-900 break-words">{selectedMessage.sender?.name}</p>
              </div>
              {user?.role !== 'staff' && user?.role !== 'admin' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <p className="mt-1 text-sm text-gray-900 break-words">
                    {user?.role === 'patient' && selectedMessage.recipient?.role !== 'patient'
                      ? 'Clinic Staff'
                      : selectedMessage.recipient?.name}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Subject:</label>
                <p className="mt-1 text-sm text-gray-900 break-words">{selectedMessage.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message:</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 sm:p-4 rounded-lg break-words">
                  {selectedMessage.content}
                </div>
              </div>
              {selectedMessage.attachment_path && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Attachment:</label>
                  <a
                    href={selectedMessage.attachment_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 break-all"
                  >
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    Download Attachment
                  </a>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Message Composer Modal */}
        <Modal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          title="New Message"
          size="lg"
        >
          <MessageComposer onSuccess={handleComposeSuccess} onCancel={() => setIsComposerOpen(false)} />
        </Modal>
      </div>
    </Layout>
  );
};
