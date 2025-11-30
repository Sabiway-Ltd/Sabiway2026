// app/terms-of-use/page.tsx

import ReaderClient from "../_components/common/ReaderClient";
import Navbar from "../_components/landing_page/Navbar";

export default function ReaderPage() {
  // Example PDF in public folder
  const pdfFile = "/SabiWay_Terms_of_Use.pdf"; // Place example.pdf in the public folder

  return (
    <div className="w-full">
      <Navbar/>
      <div className="mt-20">
        <ReaderClient file={pdfFile} />
      </div>
    </div>
  );
}
