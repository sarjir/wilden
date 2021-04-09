import { useEffect, useState } from "react";
import logo from "./logo.svg";
// import firebase from "firebase";
import { storage } from "./firebase.js";
import "./App.css";

function App() {
  console.log("storage", storage);
  const storageRef = storage.ref();
  // const imagesRef = storageRef.child("images");
  // const oneImage = `${storageRef}PILEA-PEPEROMIOIDES-‘MOJITO’.jpg`;
  const oneImage = storageRef.child("PILEA-PEPEROMIOIDES-‘MOJITO’.jpg");
  console.log("oneImage", oneImage);
  const [url, setUrl] = useState("");

  useEffect(() => {
    oneImage.getDownloadURL().then((url) => {
      console.log("url", url);
      setUrl(url);
      // return url;
    });
  }, [oneImage]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
      <img src={url} alt="test" />
    </div>
  );
}

export default App;
