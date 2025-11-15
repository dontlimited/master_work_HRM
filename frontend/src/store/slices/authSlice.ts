import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AuthUser = { id: string; email: string; role: string };
type AuthState = { token: string | null; user: AuthUser | null };

const initialState: AuthState = { token: null, user: null };

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    }
  }
});

export const { setAuth, logout } = slice.actions;
export default slice.reducer;


