import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Post from './components/Post';
import MyPage from './components/MyPage';
import Edit from './components/Edit';
import Archive from './components/Archive';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={`/signup/`} element={<Signup />} />
          <Route path={`/login/`} element={<Login />} />
          <Route path={`/`} element={<Home />} />
          <Route path={`/post`} element={<Post />} />
          <Route path={`/mypage`} element={<MyPage />} />
          <Route path={`/edit`} element={<Edit />} />
          <Route path={`/archive`} element={<Archive />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;