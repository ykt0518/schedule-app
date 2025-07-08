import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, updateDoc, doc, arrayRemove } from "firebase/firestore";
import { auth, db } from '../firebase';
import Modal from 'react-modal';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Header from './Header';
import Sidebar from './Sidebar';

const MyPage = () => {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState([]);
  const [imageCheckResults, setImageCheckResults] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("likes", "array-contains", currentUser.uid));
        onSnapshot(q, (snapshot) => {
          const likedPostsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dateStart: doc.data().dateStart.toDate ? doc.data().dateStart.toDate() : new Date(doc.data().dateStart),
            dateEnd: doc.data().dateEnd.toDate ? doc.data().dateEnd.toDate() : new Date(doc.data().dateEnd)
          }));
          const sortedPosts = sortPostsByDate(likedPostsList);
          setLikedPosts(sortedPosts);
          checkImages(sortedPosts);
        });
      }
    });
  }, []);

  const sortPostsByDate = (posts) => {
    return posts.sort((a, b) => b.dateStart - a.dateStart);
  };

  const checkImages = async (postList) => {
    const results = {};
    for (const post of postList) {
      if (post.imageUrl) {
        results[post.imageUrl] = await isImage(post.imageUrl);
      }
    }
    setImageCheckResults(results);
  };

  const handleUnlike = async (postId) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      likes: arrayRemove(user.uid)
    });
  };

  const auth = getAuth();
  const navigate = useNavigate();

  const logout = async () => {
    signOut(auth).then(() => {
      navigate("/login/");
    }).catch((error) => {
      console.log(error);
    });
  }

  const isImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const getFileNameFromUrl = (url) => {
    const parts = url.split('/');
    const fileNameWithParams = parts[parts.length - 1];
    const fileNameParts = fileNameWithParams.split('?');
    const fileName = decodeURIComponent(fileNameParts[0]);

    if (fileName.includes("files/")) {
      const withoutFiles = fileName.replace("files/", "");
      return withoutFiles;
    }

    return fileName;
  };

  const openModal = (url) => {
    setModalImageUrl(url);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setModalImageUrl("");
  };

  return (
    <>
      <Header />
      <div className='p-5'>
        <div className='flex gap-5'>
          <div className='grow text-gray-600 space-y-5 px-4 py-8 shadow-xl border rounded-xl'>
            <div>
              <h2 className='text-lg font-medium mb-5'>マイページ</h2>
              <p className='mb-1.5'>登録メールアドレス</p>
              <p className='mt-0'>{user?.email}</p>
            </div>
            <div>
              <h3 className='text-lg font-medium mb-5'>参加予定のイベント</h3>
              {likedPosts.map((post) => (
                <div key={post.id} className='p-5 border rounded-xl shadow-xl mb-5'>
                  <h1 className='text-xl font-medium mb-2.5'>{post.title}</h1>
                  <p className='mb-1.5'>
                    ジャンル：
                    {post.design && <span className="mr-2">デザイン</span>}
                    {post.coding && <span className="mr-2">コーディング</span>}
                    {post.other && <span className="mr-2">その他</span>}
                  </p>
                  <p className='mb-1.5'>
                    開始日時：{post.dateStart.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className='mb-1.5'>
                    終了日時：{post.dateEnd.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {post.url && (
                    <p className='mb-1.5'>イベントURL：<a href={post.url} target="_blank" rel="noopener noreferrer" className='hover:text-blue-700 transition duration-300'>{post.url}</a></p>
                  )}
                  {post.imageUrl && (
                    <div className='mb-1.5'>
                      {imageCheckResults[post.imageUrl] ? (
                        <>
                          <img
                            src={post.imageUrl}
                            alt="ポスト画像"
                            className="w-96 h-72 object-cover cursor-pointer hover:opacity-80 transition duration-300"
                            onClick={() => openModal(post.imageUrl)}
                          />
                        </>
                      ) : (
                        <>
                          ファイル：<a href={post.imageUrl} target="_blank" rel="noopener noreferrer" className='hover:text-blue-700 transition duration-300'>{getFileNameFromUrl(post.imageUrl)}</a>
                        </>
                      )}
                    </div>
                  )}
                  <div className='text-right'>
                    <button onClick={() => handleUnlike(post.id)} className='ml-2'>
                      <FavoriteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Sidebar />
        </div>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Image Modal"
          className="modal"
          overlayClassName="modal-overlay"
        >
          <button onClick={closeModal} className="modal-close-button hover:animate-spin transition duration-300">✖</button>
          <img src={modalImageUrl} alt="Modal Image" className="modal-image" />
        </Modal>
      </div>
    </>
  );
};

export default MyPage;
