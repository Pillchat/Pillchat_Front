import { FC } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Image } from "../atoms";

export const ImageCarousel: FC<{
  images: string[];
  showButtons?: boolean;
  maxContainerHeight?: string;
}> = ({ images, showButtons = false }) => {
  return (
    <Carousel className="w-full">
      <CarouselContent className="-ml-2 md:-ml-4">
        {images.map((image, index) => (
          <CarouselItem key={index} className="pl-2 md:pl-4">
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-50 p-1">
              <Image
                src={image}
                alt={`Image ${index + 1}`}
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center space-x-2">
          <div className="text-sm text-gray-500">
            {images.length}개의 이미지
          </div>
        </div>
      )}
      {showButtons && images.length > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
};
