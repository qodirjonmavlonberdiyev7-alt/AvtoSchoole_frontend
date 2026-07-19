import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthTokensDto, UserDto } from '@avtoschoole/shared';

type Session = AuthTokensDto & { user: UserDto };

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** The superadmin's own session, stashed while they're managing a teacher's account as that teacher. */
  impersonatorSession: Session | null;
}

function readUser(): UserDto | null {
  const raw = localStorage.getItem('auth.user');
  return raw ? (JSON.parse(raw) as UserDto) : null;
}

function readImpersonatorSession(): Session | null {
  const raw = localStorage.getItem('auth.impersonatorSession');
  return raw ? (JSON.parse(raw) as Session) : null;
}

const initialState: AuthState = {
  user: readUser(),
  accessToken: localStorage.getItem('auth.accessToken'),
  refreshToken: localStorage.getItem('auth.refreshToken'),
  impersonatorSession: readImpersonatorSession(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsSet(state, action: PayloadAction<Session>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('auth.user', JSON.stringify(action.payload.user));
      localStorage.setItem('auth.accessToken', action.payload.accessToken);
      localStorage.setItem('auth.refreshToken', action.payload.refreshToken);
    },
    tokensRefreshed(state, action: PayloadAction<AuthTokensDto>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('auth.accessToken', action.payload.accessToken);
      localStorage.setItem('auth.refreshToken', action.payload.refreshToken);
    },
    userUpdated(state, action: PayloadAction<UserDto>) {
      state.user = action.payload;
      localStorage.setItem('auth.user', JSON.stringify(action.payload));
    },
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.impersonatorSession = null;
      localStorage.removeItem('auth.user');
      localStorage.removeItem('auth.accessToken');
      localStorage.removeItem('auth.refreshToken');
      localStorage.removeItem('auth.impersonatorSession');
    },
    /** Superadmin switches into a teacher's account - stash the current (superadmin) session first. */
    impersonationStarted(state, action: PayloadAction<Session>) {
      if (state.user && state.accessToken && state.refreshToken) {
        const snapshot: Session = { user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken };
        state.impersonatorSession = snapshot;
        localStorage.setItem('auth.impersonatorSession', JSON.stringify(snapshot));
      }
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('auth.user', JSON.stringify(action.payload.user));
      localStorage.setItem('auth.accessToken', action.payload.accessToken);
      localStorage.setItem('auth.refreshToken', action.payload.refreshToken);
    },
    /** Restores the superadmin's own session, ending the "managing as teacher" mode. */
    impersonationEnded(state) {
      if (!state.impersonatorSession) {
        return;
      }
      const { user, accessToken, refreshToken } = state.impersonatorSession;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.impersonatorSession = null;
      localStorage.setItem('auth.user', JSON.stringify(user));
      localStorage.setItem('auth.accessToken', accessToken);
      localStorage.setItem('auth.refreshToken', refreshToken);
      localStorage.removeItem('auth.impersonatorSession');
    },
  },
});

export const { credentialsSet, tokensRefreshed, userUpdated, loggedOut, impersonationStarted, impersonationEnded } =
  authSlice.actions;
export default authSlice.reducer;
