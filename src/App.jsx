import { BrowserRouter } from "react-router-dom";
import PrincipalRoutes from "./routes/PrincipalRoutes";

const App = () => {
  return (
    <BrowserRouter>
      <PrincipalRoutes />
    </BrowserRouter>
  );
};

export default App;
