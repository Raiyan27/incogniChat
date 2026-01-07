import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const STORAGE_KEY = "chat_username";
const generateUserName = () => {
  const ADJECTIVES = ["Swift", "Silent", "Clever", "Brave", "Mighty"];
  const ANIMALS = ["Lion", "Eagle", "Shark", "Wolf", "Tiger"];

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

  return `${adjective}-${animal}-${nanoid(4)}`;
};

export const useUsername = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const main = () => {
      const storedName = localStorage.getItem(STORAGE_KEY);
      if (storedName) {
        setUsername(storedName);
      } else {
        const newName = generateUserName();
        localStorage.setItem(STORAGE_KEY, newName);
        setUsername(newName);
      }
    };
    main();
  }, []);

  return username;
};
