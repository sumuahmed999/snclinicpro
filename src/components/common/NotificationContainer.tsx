import React from 'react';
import Notification, { type NotificationProps } from './Notification';

export interface NotificationItem extends NotificationProps {
  id: string;
}

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
  position?: NotificationProps['position'];
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  position = 'top-right',
}) => {
  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          position={position}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </>
  );
};

export default NotificationContainer;
