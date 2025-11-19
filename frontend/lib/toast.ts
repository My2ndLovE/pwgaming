import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },

  error: (message: string) => {
    toast.error(message);
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  // Game-specific toasts
  gameAction: (action: string, success: boolean) => {
    if (success) {
      toast.success(`${action} successful`);
    } else {
      toast.error(`${action} failed`);
    }
  },

  connectionStatus: (isConnected: boolean) => {
    if (isConnected) {
      toast.success('Connected to game server', { duration: 2000 });
    } else {
      toast.error('Disconnected from server', { duration: 0 });
    }
  },

  turnNotification: (timeRemaining: number) => {
    if (timeRemaining <= 5) {
      toast('Your turn! Time running out', {
        icon: '⏱️',
        duration: timeRemaining * 1000,
      });
    } else {
      toast('Your turn to act', {
        icon: '🎮',
        duration: 3000,
      });
    }
  },

  handWon: (amount: number) => {
    toast.success(`You won ${amount} chips!`, {
      icon: '🎉',
      duration: 5000,
    });
  },

  handLost: () => {
    toast('Better luck next time', {
      icon: '😔',
      duration: 3000,
    });
  },
};
