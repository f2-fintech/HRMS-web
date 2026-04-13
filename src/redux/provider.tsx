"use client";
import React from "react";
import { Provider, useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import store, { RootState, AppDispatch } from "./store";

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

function ReduxProvider({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
