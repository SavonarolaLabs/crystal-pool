import toast from 'svelte-french-toast';

export const showToast = (message:string, type = 'default') => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
  });
};
