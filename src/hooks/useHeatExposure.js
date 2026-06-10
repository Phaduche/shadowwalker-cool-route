import { useState, useEffect } from "react";

import { fetchRealShelters } from "../data/shelterData";

// tis for calculating distances (now inside hook, no utils needed)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function useHeatExposure(currentLat, currentLng) {
  const [seconds, setSeconds] = useState(0); // time passed(seconds)
  const [isOutdoor, setIsOutdoor] = useState(true); // user status (outdoor/indoor)
const [realShelters, setRealShelters] = useState([]); // shelters

// getting shelter infos
  useEffect(() => {
    if (!currentLat || !currentLng) return;

    async function loadRealShelters() {
      const data = await fetchRealShelters(currentLat, currentLng);
      setRealShelters(data);
    }
    loadRealShelters();
  }, [currentLat, currentLng]);

  // fucion to get closest shelter info for notification
  const getClosestShelterMessage = () => {
    if (!realShelters || realShelters.length === 0) {
      return "\nThere are no nearby shelters found in the data. Please stay safe and find shade or a cool place nearby!";
    }

    // calculate distance to each shelter
    const placesWithDistance = realShelters.map((shelter) => {
      const distance = getDistanceInMeters(currentLat, currentLng, shelter.lat, shelter.lng);
      return { ...shelter, calculatedDistance: distance };
    });

    // sort nearest one
    placesWithDistance.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    const closest = placesWithDistance[0];

    return `\nclosest shelter: ${closest.name} (${closest.calculatedDistance}m)`;
  };

// tis for testing without waiting ;)
const triggerTestNotification = () => {
  if (Notification.permission === "granted") {
    const shelterMsg = getClosestShelterMessage();
    new Notification("Test Alert", {
      body: `This is a demo notification for testing (1-hour alert simulation).${shelterMsg}`,
    });
  } else {
    console.log("Notification permission not granted");
  }
};

//ask for notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // calculate distance whenever user moves
  useEffect(() => {
    if (!realShelters || realShelters.length === 0) {
      setIsOutdoor(true);
      return;
    }

    let isInside = false;
    realShelters.forEach((shelter) => {
      const distance = getDistanceInMeters(currentLat, currentLng, shelter.lat, shelter.lng);
      if (distance <= 15) {
        isInside = true;
      }
    });

    setIsOutdoor(!isInside);
  }, [currentLat, currentLng, realShelters]);


  // timer logic here :)
  useEffect(() => {
    let timer;

    if (isOutdoor) {
      timer = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;

          const currentHour = Math.floor(next / 3600);

          if (
            next % 3600 === 0 &&
            Notification.permission === "granted"
          ) {
            const shelterMsg = getClosestShelterMessage();
            new Notification("Time for water and rest!", {
              body: `You've been exposed to heat for ${currentHour} hour(s). Take a break in the shade!${shelterMsg}`,
            });
          }

          return next;
        });
      }, 1000);
    } else {
      setSeconds(0); // reset timer indoor
    }

    return () => clearInterval(timer);
  }, [isOutdoor, realShelters]);

  return {
    seconds,
    isOutdoor,
    triggerTestNotification,
  };
}