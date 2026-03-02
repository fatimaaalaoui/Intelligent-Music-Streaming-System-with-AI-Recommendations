/*import React from 'react'
import { Routes } from 'react-router-dom'
import DisplayHome from './DisplayHome'*/

/*const Display = () => {
  return (
    <div className='w-[100] m-2 px-6 pt-4 rounded bg-[#121212] texte-white overflow-auto lg:w-[75] lg:ml-0 '>
        <Routes>
            <Route path='/' element={<DisplayHome/>}/>
        </Routes>
    </div>
  )
}
export default Display

import { Routes, Route } from "react-router-dom";
import DisplayHome from "./DisplayHome";

export default function Display() {
  return (
    <div className="m-2 px-6 pt-4 rounded bg-[#121212] text-white overflow-auto w-full lg:w-3/4 lg:ml-0 pb-28">
      <Routes>
        <Route path="/" element={<DisplayHome />} />
      </Routes>
    </div>
  );
}*/
/*import FilterChips from "./components/FilterChips";

// src/components/Display.jsx

export default function Display({ user, onPlayTrack }) {
  return (
    <div className="m-2 px-6 pt-4 rounded bg-[#121212] text-white overflow-auto w-full lg:w-3/4 lg:ml-0 pb-28">
      <DisplayHome user={user} onPlayTrack={onPlayTrack} />
    </div>
  );
}*/
import { Routes, Route } from "react-router-dom";
import DisplayHome from "./DisplayHome";
import SearchPage from "./SearchPage";

export default function Display({ user, onPlayTrack }) {
  return (
    <div className="m-2 px-6 pt-4 rounded bg-[#121212] text-white overflow-auto w-full lg:w-3/4 lg:ml-0 pb-28">
      <Routes>
        <Route path="/" element={<DisplayHome user={user} onPlayTrack={onPlayTrack} />} />
        <Route path="/search" element={<SearchPage onPlayTrack={onPlayTrack} />} />
      </Routes>
    </div>
  );
}




