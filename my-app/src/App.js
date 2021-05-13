import { useEffect, useState } from 'react';
import logo from './logo.svg';
import { storage, db } from './firebase.js';

import './App.css';

function App() {
  const storageRef = storage.ref();
  const oneImage = storageRef.child('PILEA-PEPEROMIOIDES-‘MOJITO’.jpg');
  const [url, setUrl] = useState('');
  const [plant, setPlant] = useState('');

  useEffect(() => {
    oneImage.getDownloadURL().then((url) => {
      setUrl(url);
    });
  }, [oneImage]);

  useEffect(() => {
    const docRef = db.collection('data-lake').doc('1LghUT1fj1k3OkrPgBYb');

    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          console.log('Document data:', doc.data());
          const image = doc.data().imageUrl;
          console.log('image', image);

          return storageRef.child(image);
        } else {
          console.log('No such document!');
        }
      })
      .then((image) => {
        console.log('hello??');

        image.getDownloadURL().then((url) => {
          setPlant(url);
        });
      })
      .catch((error) => {
        console.error('Error getting document:', error);
      });
  }, [plant, storageRef]);

  console.log('plant', plant);

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
      <img src={url} alt='test' />
      <img src={plant} alt='test' />
    </div>
  );
}

export default App;
