import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import './app/app.css'

export default function App() {
  return <RouterProvider router={router} />
}
