import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { db, storage, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Modal from 'react-modal';
import Header from './Header';
import Sidebar from './Sidebar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

Modal.setAppElement('#root');

const Edit = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [title, setTitle] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [url, setUrl] = useState("");
  const [coding, setCoding] = useState(false);
  const [design, setDesign] = useState(false);
  const [other, setOther] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageCheckResults, setImageCheckResults] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempFile, setTempFile] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      const postQuery = query(collection(db, "posts"), where("uid", "==", user.uid));
      onSnapshot(postQuery, (postSnapshot) => {
        const postList = postSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            dateStart: data.dateStart.toDate ? data.dateStart.toDate() : new Date(data.dateStart.seconds * 1000),
            dateEnd: data.dateEnd.toDate ? data.dateEnd.toDate() : new Date(data.dateEnd.seconds * 1000),
            id: doc.id,
          };
        });
        postList.sort((a, b) => b.dateStart - a.dateStart);
        setPosts(postList);
        checkImages(postList);
      });
    }
  }, [user]);

  const checkImages = async (postList) => {
    const results = {};
    for (const post of postList) {
      if (post.imageUrl) {
        results[post.imageUrl] = await isImage(post.imageUrl);
      }
    }
    setImageCheckResults(results);
  };

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setDateStart(new Date(post.dateStart.getTime() - post.dateStart.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setDateEnd(new Date(post.dateEnd.getTime() - post.dateEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setUrl(post.url);
    setCoding(post.coding);
    setDesign(post.design);
    setOther(post.other);
    setUploadProgress(0);
  };

  const handleCancel = () => {
    setEditingPostId(null);
    setTitle("");
    setDateStart("");
    setDateEnd("");
    setUrl("");
    setCoding(false);
    setDesign(false);
    setOther(false);
    setUploadProgress(0);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    let fileUrl = null;

    if (tempFile) {  // 一時ファイルがある場合のみアップロード
      const storageRef = ref(storage, `files/${tempFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, tempFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed: ", error);
        },
        async () => {
          fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          updatePost(fileUrl);
        }
      );
    } else {
      updatePost(file);
    }
  };

  const updatePost = async (fileUrl) => {
    if (editingPostId) {
      const postDoc = doc(db, "posts", editingPostId);
      await updateDoc(postDoc, {
        title: title,
        url: url,
        dateStart: Timestamp.fromDate(new Date(dateStart)),
        dateEnd: Timestamp.fromDate(new Date(dateEnd)),
        design: design,
        coding: coding,
        other: other,
        imageUrl: fileUrl
      });
      setEditingPostId(null);
      handleCancel();
    }
  };

  const handleDelete = async (postId) => {
    const confirmDelete = window.confirm("削除しますか？");

    if (confirmDelete) {
      try {
        const postDoc = doc(db, "posts", postId);
        await deleteDoc(postDoc);
      } catch (error) {
        console.error("ドキュメントの削除エラー: ", error);
      }
    }
  };

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setTempFile(selectedFile);
    setFileName(selectedFile.name);
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
            <h2 className='text-lg font-medium mb-5'>編集・削除</h2>
            {posts.map((post) => (
              <div key={post.id} className='p-5 border rounded-xl shadow-xl mb-5'>
                {editingPostId === post.id ? (
                  <form onSubmit={handleUpdate} onKeyDown={handleKeyDown}>
                    <p className='mb-2'>タイトル</p>
                    <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300 mb-5" />
                    <p className='mb-2'>ジャンル</p>
                    <div className='flex flex-wrap gap-5 mb-5'>
                      <div>
                        <input type='checkbox' id='design' name="design" checked={design} onChange={(e) => setDesign(e.target.checked)} className="mr-2" />
                        <label htmlFor="design">デザイン</label>
                      </div>
                      <div>
                        <input type='checkbox' id='coding' name="coding" checked={coding} onChange={(e) => setCoding(e.target.checked)} className="mr-2" />
                        <label htmlFor="coding">コーディング</label>
                      </div>
                      <div>
                        <input type='checkbox' id='other' name="other" checked={other} onChange={(e) => setOther(e.target.checked)} className="mr-2" />
                        <label htmlFor="other">その他</label>
                      </div>
                    </div>
                    <p className='mb-2'>開催日時</p>
                    <div className='flex items-center gap-3.5 mb-2'>
                      <span className='shrink-0'>開始</span>
                      <input type='datetime-local' value={dateStart} onChange={(e) => setDateStart(e.target.value)} required className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
                    </div>
                    <div className='flex items-center gap-3.5 mb-5'>
                      <span className='shrink-0'>終了</span>
                      <input type='datetime-local' value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} required className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
                    </div>
                    <div className='mb-5'>
                      <p className='mb-2'>イベントURL</p>
                      <input type='url' value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300 mb-5" />
                    </div>
                    <div className='mb-5'>
                      <p className='mb-2'>ファイルアップロード</p>
                      <input type='file' name='fileUrl' onChange={handleFileChange} className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
                    </div>
                    {uploadProgress > 0 && <progress value={uploadProgress} max="100" className="w-full" />}
                    <div className='flex justify-end gap-5 mt-2.5'>
                      <button type="submit" className='w-full px-4 py-2 text-white font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'>編集する</button>
                      <button type="button" onClick={handleCancel} className='w-full px-4 py-2 text-white font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'>やめる</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className='text-xl font-medium mb-2.5'>{post.title}</h1>
                    <p className='mb-1.5'>ジャンル：
                      {post.design && <span>デザイン </span>}
                      {post.coding && <span>コーディング </span>}
                      {post.other && <span>その他</span>}
                    </p>
                    <p className='mb-1.5'>開始日時：{post.dateStart.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className='mb-1.5'>終了日時：{post.dateEnd.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
                    <div className='flex justify-end gap-5 mt-2.5'>
                      <button onClick={() => handleEdit(post)} className='hover:text-blue-700 transition duration-300'><EditIcon /></button>
                      <button onClick={() => handleDelete(post.id)} className='hover:text-red-600 transition duration-300'><DeleteIcon /></button>
                    </div>
                  </>
                )}
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
  );
};

export default Edit;
