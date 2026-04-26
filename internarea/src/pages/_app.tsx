import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "../i18n";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/ store";
import { Provider, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function App({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function AuthListener() {
    const dispatch = useDispatch();
    useEffect(() => {
      auth.onAuthStateChanged((authuser) => {
        if (authuser) {
          localStorage.removeItem("customAuth");
          dispatch(
            login({
              uid: authuser.uid,
              photo: authuser.photoURL,
              name: authuser.displayName,
              email: authuser.email,
              phoneNumber: authuser.phoneNumber,
            })
          );
        } else {
          const customAuth = localStorage.getItem("customAuth");
          if (customAuth) {
            dispatch(login(JSON.parse(customAuth)));
          } else {
            dispatch(logout());
          }
        }
      });
    }, [dispatch]);
    return null;
  }

  if (!isMounted) return null;

  return (
    <Provider store={store}>
      <AuthListener />
      <div className="bg-white">
        <ToastContainer/>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </div>
    </Provider>
  );
}