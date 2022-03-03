import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";

//Style
import styled from "styled-components";

const Videoplayer = () => {
  return (
    <div>
      <video autoPlay playsInline />
    </div>
  );
};

export default Videoplayer;
