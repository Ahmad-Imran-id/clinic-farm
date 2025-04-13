import { auth } from '../firebase-config';

export const getCurrentUserUid = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};
