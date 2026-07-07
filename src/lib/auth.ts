import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { UseCase, UserProfile } from "./types";

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  useCase: UseCase,
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await saveUserProfile(cred.user.uid, {
    displayName,
    email: cred.user.email ?? email,
    useCase,
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(): Promise<{ isNewUser: boolean }> {
  const result = await signInWithPopup(auth, googleProvider);
  const profile = await getUserProfile(result.user.uid);
  if (!profile) {
    return { isNewUser: true };
  }
  return { isNewUser: false };
}

export async function completeGoogleSignup(useCase: UseCase): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await saveUserProfile(user.uid, {
    displayName: user.displayName ?? "User",
    email: user.email ?? "",
    useCase,
  });
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function saveUserProfile(
  uid: string,
  data: { displayName: string; email: string; useCase: UseCase },
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    displayName: data.displayName,
    email: data.email,
    useCase: data.useCase,
    createdAt: Date.now(),
    customProgressOptions: [],
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid,
    displayName: d.displayName ?? "User",
    email: d.email ?? "",
    useCase: d.useCase ?? "realestate",
    createdAt: d.createdAt ?? Date.now(),
    customProgressOptions: Array.isArray(d.customProgressOptions) ? d.customProgressOptions : [],
  };
}

export async function addCustomProgressOption(uid: string, option: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    customProgressOptions: arrayUnion(option.trim()),
  });
}

export async function removeCustomProgressOption(uid: string, option: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    customProgressOptions: arrayRemove(option.trim()),
  });
}

export async function renameCustomProgressOption(uid: string, oldOption: string, newOption: string): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  let options: string[] = Array.isArray(data.customProgressOptions) ? data.customProgressOptions : [];
  
  options = options.map((opt) => (opt === oldOption.trim() ? newOption.trim() : opt));
  
  await updateDoc(ref, {
    customProgressOptions: options,
  });
}
