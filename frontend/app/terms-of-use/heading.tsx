export default function Heading ({ text }: { text: string }) {
    return(
            <h2
              className="
                text-md md:text-xl
                font-semibold 
                mb-4 
                text-[#008753] 
                flex 
                items-center 
                gap-3
              "
            >
              <span className="w-2 h-6 sm:h-8 bg-[#008753] rounded-full"></span>
              {text}
            </h2>
    )
}