import React, { useEffect, useState } from 'react';
import { auth, provider } from '../firebase';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { Navigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { validationSchema } from '../utils/validationSchema';
import { zodResolver } from '@hookform/resolvers/zod';

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ 
    mode: "onBlur",
    resolver: zodResolver(validationSchema),
  });

  const onSubmit = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Error:", error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign In Error:", error.message);
    }
  };

  const [user, setUser] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <div className='w-full h-screen flex self-center place-content-center place-items-center'>
      {user ? (
        <Navigate to={`/`} />
      ) : (
        <div className='w-96 text-gray-600 space-y-5 px-4 py-8 shadow-xl border rounded-xl'>
          <h3 className='text-gray-800 text-xl text-center font-semibold sm:text-2xl'>アカウントを作成</h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className='pb-5'>
              <label className="text-sm text-gray-600 font-bold">メールアドレス</label>
              <input
                name="email"
                type="email"
                {...register("email")}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
              />
              <p className='text-red-600'>{errors.email?.message}</p>
            </div>
            <div className='pb-5'>
              <label className="text-sm text-gray-600 font-bold">パスワード</label>
              <input
                name="password"
                type="password"
                {...register("password")}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
              />
              <p className='text-red-600'>{errors.password?.message}</p>
            </div>
            <button type="submit" className='w-full px-4 py-2 text-white font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'>アカウントを作成</button>
          </form>
          <p className="text-center text-sm">アカウントをすでに持っている方は <Link to={`/login/`} className='hover:text-blue-700 transition duration-300'>こちら</Link></p>
          <div className='flex flex-row text-center w-full'>
            <span className='border-b-2 mb-2.5 mr-2 w-full'></span>
            <div className='text-sm font-bold w-fit'>OR</div>
            <span className='border-b-2 mb-2.5 ml-2 w-full'></span>
          </div>

          <button onClick={signInWithGoogle} className='w-full px-4 py-2 border border-slate-300 font-medium rounded-lg hover:shadow-xl transition duration-300 flex self-center place-content-center place-items-center'>
            <p className='text-sm'>Googleでログイン</p>
          </button>
        </div>
      )}
    </div>
  )
}

export default Signup;