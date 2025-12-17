import { BrowserRouter } from "react-router-dom";
import NavbarApp from "./components/NavbarApp";
import FooterApp from "./components/FooterApp";
import PrincipalRoutes from "./routes/PrincipalRoutes";

const App = () => {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavbarApp />
        <div style={{ flex: 1 }}>
          <PrincipalRoutes />
        </div>
        <FooterApp />
      </div>
    </BrowserRouter>
  );
};

export default App;