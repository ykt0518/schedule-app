import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from '../firebase';
import { Navigate } from "react-router-dom";
import { collection, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import Modal from 'react-modal';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Header from './Header';
import Sidebar from './Sidebar';
import SearchIcon from '@mui/icons-material/Search';

const Archive = () => {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [imageCheckResults, setImageCheckResults] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const postData = collection(db, "posts");
    onSnapshot(postData, (postSnapshot) => {
      const postList = postSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          dateStart: data.dateStart.toDate ? data.dateStart.toDate() : new Date(),
          dateEnd: data.dateEnd.toDate ? data.dateEnd.toDate() : new Date(),
          id: doc.id,
        };
      });
      postList.sort((a, b) => b.dateStart - a.dateStart);
      setPosts(postList);
      checkImages(postList);
    });
  }, []);

  const checkImages = async (postList) => {
    const results = {};
    for (const post of postList) {
      if (post.imageUrl) {
        results[post.imageUrl] = await isImage(post.imageUrl);
      }
    }
    setImageCheckResults(results);
  };

  const handleLike = async (postId) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    const userId = user.uid;
    const post = posts.find((post) => post.id === postId);

    if (post && post.likes && post.likes.includes(userId)) {
      await updateDoc(postRef, {
        likes: arrayRemove(userId),
      });
    } else if (post) {
      await updateDoc(postRef, {
        likes: arrayUnion(userId),
      });
    }
  };

  const ref = useRef();

  const handleSearch = () => {
    const query = ref.current.value.toLowerCase();
    setSearchQuery(query);
  };

  const applyFilters = (postList) => {
    let filtered = postList;

    if (searchQuery) {
      filtered = filtered.filter((post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter((post) =>
        selectedGenres.some((genre) => post[genre])
      );
    }

    return filtered;
  };

  const filteredPosts = applyFilters(posts);

  const onChangeGenre = (e) => {
    const genre = e.target.value;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedGenres([...selectedGenres, genre]);
    } else {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    }
  };

  const isImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const isPDF = (url) => {
    return url.toLowerCase().endsWith(".pdf");
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
    <div>
      {!loading && (
        <>
          {!user ? (
            <Navigate to={`/login/`} />
          ) : (
            <>
              <Header />
              <div className='p-5'>
                <div className='flex gap-5'>
                  <div className='grow'>
                    <div className="w-full p-2 pr-2 mb-5 flex items-center gap-2 border rounded-lg shadow-sm mb-5">
                      <div className='w-6 h-6'><SearchIcon /></div>
                      <input
                        type="text"
                        name="q"
                        placeholder="イベントを検索..."
                        required=""
                        className='w-full text-gray-500 bg-transparent outline-none transition duration-300'
                        ref={ref}
                        onChange={handleSearch}
                      />
                    </div>
                    <div className='flex flex-wrap gap-2.5 mb-5'>
                      <div>
                        <input
                          type='checkbox'
                          id='design'
                          name='design'
                          onChange={onChangeGenre}
                          value="design"
                          className="mr-2"
                        />
                        <label htmlFor='design'>デザイン</label>
                      </div>
                      <div>
                        <input
                          type='checkbox'
                          id='coding'
                          name='coding'
                          onChange={onChangeGenre}
                          value="coding"
                          className="mr-2"
                        />
                        <label htmlFor='coding'>コーディング</label>
                      </div>
                      <div>
                        <input
                          type='checkbox'
                          id='other'
                          name='other'
                          onChange={onChangeGenre}
                          value="other"
                          className="mr-2"
                        />
                        <label htmlFor='other'>その他</label>
                      </div>
                    </div>

                    {filteredPosts.map((post) => (
                      <div key={post.id} id={post.id} className='p-5 border rounded-xl shadow-xl mb-5'>
                        <h1 className='text-xl font-medium mb-2.5'>{post.title}</h1>
                        <div className='mb-1.5'>
                          ジャンル：
                          {post.design && <span className="mr-2">デザイン</span>}
                          {post.coding && <span className="mr-2">コーディング</span>}
                          {post.other && <span className="mr-2">その他</span>}
                        </div>
                        <div className='mb-1.5'>
                          開始日時：{post.dateStart.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className='mb-1.5'>
                          終了日時：{post.dateEnd.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {post.url && (
                          <div className='mb-1.5'>イベントURL：<a href={post.url} target="_blank" rel="noopener noreferrer" className='hover:text-blue-700 transition duration-300'>{post.url}</a></div>
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
                          <button type="button" onClick={() => handleLike(post.id)}>
                            {post.likes && post.likes.includes(user.uid) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                          </button>
                        </div>
                      </div>
                    ))}
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
          )}
        </>
      )}
    </div>
  );
};

export default Archive;
