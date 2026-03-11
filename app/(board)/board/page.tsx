import { Suspense } from "react";
import BoardClient from "./BoardClient";

const BoardPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-border">Loading...</div>
        </div>
      }
    >
      <BoardClient />
    </Suspense>
  );
};

export default BoardPage;