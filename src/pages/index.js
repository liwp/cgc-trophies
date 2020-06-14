import React, { useEffect } from "react";
import { useRouter } from "next/router";

export default () => {
  const router = useRouter();
  useEffect(() => {
    if (router.pathname == "/") {
      router.replace("/trophies");
    }
  });

  return null;
};
