'use client';

import React, { useMemo } from "react";
import ExpenseEmployee from "./expenseemployee";
import ExpenseManager from "./expensemanager";
import ExpenseAdmin from "./expenseadmin";

import { utility } from "@/utility";

type UserLS = {
  role?: number | string;
  role_id?: number | string;
  user_role?: number | string;
};

function getUserRoleNumber(): number {
  const user: UserLS = utility().decodedToken() || {};
  const rRaw = user?.role ?? user?.role_id ?? user?.user_role ?? 0;
  const r = Number(rRaw) || 0;
  return r;
}

export default function ExpenseTracker() {
  const roleNum = useMemo(() => getUserRoleNumber(), []);


  if (roleNum === 1 || roleNum === 5) return <ExpenseAdmin />;

  // ✅ If you want role=3 to see manager screen, do this:
  // if (roleNum === 3) return <ExpenseManager />;

  // ✅ else employee screen
  return <ExpenseEmployee />;
}
