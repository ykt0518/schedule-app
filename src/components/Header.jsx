import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";


const Header = () => {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const auth = getAuth();
  const navigate = useNavigate();

  const logout = async () => {
    signOut(auth).then(() => {
      navigate("/login/");
    }).catch((error) => {
      console.log(error);
    });
  }

  return (
    <>
      <div className='h-16 py-2.5 px-5 bg-gray-700 text-white flex place-content-between place-items-center gap-5'>
        <p><Link to={`/`} className='hover:text-green-300 transition duration-300'>Home</Link></p>
        <div className='flex place-content-end place-items-center gap-5'>
          <p>{user?.email}</p>
          <button onClick={logout} className='border-gray-300 rounded bg-gray-300 text-gray-800 py-1.5 px-2.5 hover:bg-gray-900 hover:text-gray-400 transition duration-300'>ログアウト</button>
        </div>
      </div>
    </>
  );
};

export default Header;