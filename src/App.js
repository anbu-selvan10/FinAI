import Login from "./components/auth/login";
import Register from "./components/auth/signup";
import Form from "./components/Profile";
import Header from "./components/Header";
import HomePage from "./components/Home";

import { AuthProvider } from "./components/AuthContext";
import { useRoutes } from "react-router-dom";
import "./styles/App.css";

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
