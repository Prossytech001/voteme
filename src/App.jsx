import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import CategoryList from './pages/CategoryList';
import NomineeList from './pages/NomineeList';
import PaymentSuccess from './pages/PaymentSuccess';
import Admin from './pages/Admin';
import Results from './pages/Results';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vote" element={<Home />} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/category/:categoryId" element={<NomineeList />} />
        <Route path="/results/:categoryId" element={<Results />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
