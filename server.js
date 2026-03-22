{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw12240\paperh20160\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab560
\pard\pardeftab560\slleading20\pardirnatural\partightenfactor0

\f0\fs26 \cf0 import express from "express";\
\
const app = express();\
app.use(express.json());\
\
app.post("/agent", (req, res) => \{\
  const message = req.body.message || "";\
\
  let reply = "AI siap membantu!";\
\
  if (message.includes("laporan")) \{\
    reply = "Analisa laporan: perusahaan UNTUNG";\
  \}\
\
  res.json(\{ reply \});\
\});\
\
app.get("/", (req, res) => \{\
  res.send("AI Agent aktif \uc0\u55357 \u56960 ");\
\});\
\
app.listen(3000, () => \{\
  console.log("Server jalan");\
\});}