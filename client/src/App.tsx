import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store/store";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StoryDetail from "./pages/StoryDetail";
import CreateStory from "./pages/CreateStory";
import EditStory from "./pages/EditStory";
// import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/story/:slug" element={<StoryDetail />} />
      {/* 
      <Route path="/search" element={<Search />} />
      <Route path="/category/:category" element={<Category />} />
      <Route path="/tag/:tag" element={<Tag />} />
      <Route path="/profile/:userId" element={<Profile />} /> */}

      <Route
        path="/create-story"
        element={
          <ProtectedRoute>
            <CreateStory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/story/:id/edit"
        element={
          <ProtectedRoute>
            <EditStory />
          </ProtectedRoute>
        }
      />
      {/* 
   

              <Route
                path="/story/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditStory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <Bookmarks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              /> */}
    </Route>
  )
);

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
