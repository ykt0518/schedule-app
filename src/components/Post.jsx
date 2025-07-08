import React, { useState } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Header from './Header';
import Sidebar from './Sidebar';

const Post = () => {
  const [title, setTitle] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [url, setUrl] = useState("");
  const [design, setDesign] = useState(false);
  const [coding, setCoding] = useState(false);
  const [other, setOther] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  async function sendPost(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    let fileUrl = null;

    if (file) {
      const storageRef = ref(storage, `files/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

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
          savePost(fileUrl);
        }
      );
    } else {
      savePost(fileUrl);
    }
  }

  async function savePost(fileUrl) {
    try {
      await addDoc(collection(db, "posts"), {
        title: title,
        url: url,
        imageUrl: fileUrl,
        dateStart: Timestamp.fromDate(new Date(dateStart)),
        dateEnd: Timestamp.fromDate(new Date(dateEnd)),
        uid: auth.currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        design: design,
        coding: coding,
        other: other,
      });
      navigate('/');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  const handleDateStartChange = (e) => {
    const newDateStart = e.target.value;
    const newDateEnd = dateEnd < newDateStart ? newDateStart : dateEnd;
    setDateStart(newDateStart);
    setDateEnd(newDateEnd);
  };

  const handleDateEndChange = (e) => {
    const newDateEnd = e.target.value;
    setDateEnd(newDateEnd);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <>
      <Header />
      <div className='p-5'>
        <div className='flex gap-5'>
          <div className='grow text-gray-600 space-y-5 px-4 py-8 shadow-xl border rounded-xl'>
            <form onSubmit={sendPost} onKeyDown={handleKeyDown}>
              <div className='mb-5'>
                <p className='mb-2'>タイトル</p>
                <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
              </div>
              <div className='mb-5'>
                <p className='mb-2'>ジャンル</p>
                <div className='flex flex-wrap gap-2.5'>
                  <div>
                    <input type='checkbox' id='design' name='design' value={design} onChange={(e) => setDesign(e.target.checked)} className="mr-2" />
                    <label htmlFor='design'>デザイン</label>
                  </div>
                  <div>
                    <input type='checkbox' id='coding' name='coding' value={coding} onChange={(e) => setCoding(e.target.checked)} className="mr-2" />
                    <label htmlFor='coding'>コーディング</label>
                  </div>
                  <div>
                    <input type='checkbox' id='other' name='other' value={other} onChange={(e) => setOther(e.target.checked)} className="mr-2" />
                    <label htmlFor='other'>その他</label>
                  </div>
                </div>
              </div>
              <div className='mb-5'>
                <p className='mb-2'>開催日時</p>
                <div className='flex items-center gap-3.5 mb-2'>
                  <span className='shrink-0'>開始</span>
                  <input type='datetime-local' value={dateStart} onChange={handleDateStartChange} required className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
                </div>
                <div className='flex items-center gap-3.5'>
                  <span className='shrink-0'>終了</span>
                  <input type='datetime-local' value={dateEnd} onChange={handleDateEndChange} required className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
                </div>
              </div>
              <div className='mb-5'>
                <p className='mb-2'>イベントURL</p>
                <input type='url' value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
              </div>
              <div className='mb-5'>
                <p className='mb-2'>ファイルアップロード</p>
                <input type='file' name='fileUrl' onChange={handleFileChange} className="w-full px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300" />
              </div>
              {uploadProgress > 0 && <progress value={uploadProgress} max="100" className="w-full" />}
              <button type="submit" className='w-full px-4 py-2 text-white font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'>投稿する</button>
            </form>
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
};

export default Post;
