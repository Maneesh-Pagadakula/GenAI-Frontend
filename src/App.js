// import LoginScreen from "./features/authentication/login/loginScreen";
// import { Route, Routes } from 'react-router-dom';
// import LandingPage from "./features/dashboard/landingPage";
// import ForgotPassword from "./features/authentication/login/forgotPassword/forgotPassword";


// function App() {
//   return (
//     <div>

//       <Routes>
//         <Route exact path="/" element={<LoginScreen />} />
//         <Route path="/dashboard" element={<LandingPage/>} />
//         <Route path='/forgotPassword' element={<ForgotPassword/>}/>
//       </Routes>

//     </div>
//   );
// }

// export default App;

import React from 'react'
// import UserScreenIndex from './features/authentication/userScreenIndex';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import Router from './routes';
// import './common-components/commonStyles.css';
import "bootstrap/dist/js/bootstrap";
import { UploadProvider } from './features/dashboard/context/uploadContext';
// import { DataProvider } from './context/contextAPI';
const reload = () => window.location.reload();


function App() {
  return (
    <UploadProvider>
      <div >
        {/* <UserScreenIndex/> */}
        <BrowserRouter>
          {/* <DataProvider> */}
          <Router onEnter={reload} />
          {/* </DataProvider> */}
        </BrowserRouter>
      </div>
    </UploadProvider>
  );
}

export default App;
