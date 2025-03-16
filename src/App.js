import Login from "./components/auth/login";
import Register from "./components/auth/signup";
import Form from "./components/Profile";
import Header from "./components/Header";
import HomePage from "./components/Home";
import { ExpenseTracker } from "./components/ExpenseTracker";
import { AuthProvider } from "./components/contexts/AuthContext";
import { useRoutes } from "react-router-dom";
import "./styles/App.css";
import { BudgetTracker } from "./components/BudgetTracker";
import Chatbot from "./components/Chatbot";
import RMStore from "./components/RMstore";
import StockAnalyst from "./components/StockAnalyst";
import WishlistManager from "./components/WishlistManager";

function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
    {
      path: "/profile",
      element: <Form />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <HomePage />,
    },
    {
      path: "/expense",
      element: <ExpenseTracker />,
    },
    {
      path: "/budget",
      element: <BudgetTracker />,
    },
    {
      path: "/chatbot",
      element: <Chatbot />,
    },
    {
      path: "/RMStore",
      element: <RMStore />,
    },
    {
      path: "/stock-analyst",
      element: <StockAnalyst />,
    },
    {
      path: "/wishlist-manager",
      element: <WishlistManager />,
    },
  ];
  let routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
      <div className="layout">
        <Header />
        <div className="content">{routesElement}</div>
      </div>
    </AuthProvider>
  );
}

export default App;
