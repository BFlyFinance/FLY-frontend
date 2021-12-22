import { configureStore } from "@reduxjs/toolkit";
import accountSliceReducer from "./slices/account-slice";
import appSliceReducer from "./slices/app-slice";

const store = configureStore({
    reducer: {
        account: accountSliceReducer,
        app: appSliceReducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: true }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
