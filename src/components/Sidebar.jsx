import React from 'react';
import { NavLink } from "react-router-dom";
import SendIcon from '@mui/icons-material/Send';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';

const Sidebar = () => {
  const isCurrent = ({isActive}) => isActive ? {
    color: '#3959ff'
  } : {};

  return (
    <>
      <div className='w-80 p-5 border rounded-xl shadow-xl'>
        <p className='border-b border-gray-500 mb-5'><NavLink to={`/`} style={isCurrent} className='block p-2.5 hover:text-blue-700 transition duration-300 flex items-center'><HomeIcon className='mr-2' />ホーム</NavLink></p>
        <p className='border-b border-gray-500 mb-5'><NavLink to={`/mypage/`} style={isCurrent} className='block p-2.5 hover:text-blue-700 transition duration-300 flex items-center'><AccountCircleIcon className='mr-2' />マイページ</NavLink></p>
        <p className='border-b border-gray-500 mb-5'><NavLink to={`/archive/`} style={isCurrent} className='block p-2.5 hover:text-blue-700 transition duration-300 flex items-center'><ArticleIcon className='mr-2' />一覧</NavLink></p>
        <p className='border-b border-gray-500 mb-5'><NavLink to={`/post/`} style={isCurrent} className='block p-2.5 hover:text-blue-700 transition duration-300 flex items-center'><SendIcon className='mr-2' />新規投稿</NavLink></p>
        <p className='border-b border-gray-500 mb-5'><NavLink to={`/edit/`} style={isCurrent} className='block p-2.5 hover:text-blue-700 transition duration-300 flex items-center'><EditIcon className='mr-2' />編集・削除</NavLink></p>
      </div>
    </>
  );
};

export default Sidebar;