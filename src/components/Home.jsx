import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from '../firebase';
import { useNavigate, Navigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import jaLocale from '@fullcalendar/core/locales/ja';
import Header from './Header';
import Sidebar from './Sidebar';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const postData = collection(db, "posts");
    const unsubscribePosts = onSnapshot(postData, (postSnapshot) => {
      const postList = postSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          dateStart: data.dateStart.toDate ? data.dateStart.toDate() : new Date(data.dateStart.seconds * 1000),
          dateEnd: data.dateEnd.toDate ? data.dateEnd.toDate() : new Date(data.dateEnd.seconds * 1000),
        };
      });
      setEvents(postList.map(post => ({
        title: post.title,
        start: post.dateStart,
        end: post.dateEnd,
        extendedProps: {
          id: post.id,
          likes: post.likes || [],
        }
      })));
    });

    return () => unsubscribePosts();
  }, []);

  const handleEventClick = (clickInfo) => {
    // すべてのツールチップを削除
    const tooltips = document.querySelectorAll('.event-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());

    navigate(`/archive#${clickInfo.event.extendedProps.id}`);

    const scrollToElement = () => {
      const element = document.getElementById(clickInfo.event.extendedProps.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        setTimeout(scrollToElement, 100);
      }
    };

    setTimeout(scrollToElement, 100);
  };

  const handleEventHover = (mouseEnterInfo) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute bg-gray-900 text-white py-1.5 px-2.5 rounded z-50 text-xs event-tooltip';

    const formatDate = (date) => {
      if (!date) return '';
      const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
      return date.toLocaleString('ja-JP', options);
    };

    tooltip.innerHTML = `
      <div>
        <p>${mouseEnterInfo.event.title}</p>
        <p>${formatDate(mouseEnterInfo.event.start)} ～</p>
        <p>${mouseEnterInfo.event.end ? formatDate(mouseEnterInfo.event.end) : ''}</p>
      </div>
    `;
    document.body.appendChild(tooltip);

    const updateTooltipPosition = (e) => {
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
    };

    mouseEnterInfo.el.addEventListener('mousemove', updateTooltipPosition);
    mouseEnterInfo.el.addEventListener('mouseleave', () => {
      tooltip.remove();
      mouseEnterInfo.el.removeEventListener('mousemove', updateTooltipPosition);
    });
  };

  // 独自の休みをイベントとして追加
  const holidays = [
    { title: '会社休み', start: '2024-06-14', end: '2024-06-18' },
    { title: '会社休み', start: '2024-06-26' },
  ];

  return (
    <div>
      {!loading && (
        <>
          {!user ? (
            <Navigate to="/login/" />
          ) : (
            <>
              <Header />
              <div className='p-5'>
                <div className='flex gap-5'>
                  <div className='grow'>
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                      allDaySlot={false}
                      locales={[jaLocale]}
                      locale='ja'
                      firstDay={1}
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek',
                      }}
                      events={[...events, ...holidays]}
                      eventClick={handleEventClick}
                      eventMouseEnter={handleEventHover}
                    />
                  </div>
                  <Sidebar />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
