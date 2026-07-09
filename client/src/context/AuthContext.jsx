import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const currentUserQuery = useQuery({
    queryKey: ['workspace-user'],
    queryFn: userService.getMyProfile,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000
  });

  return (
    <AuthContext.Provider value={currentUserQuery}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthQuery = () => useContext(AuthContext);