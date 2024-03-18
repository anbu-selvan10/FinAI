import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Auth from './components/Auth';

function App() {
  return (
    <div>
    <BrowserRouter>
      <Routes>
      <Route path='/' element={<Auth />} />
      </Routes>
    </BrowserRouter>
      
    </div>
  );
}

export default App;