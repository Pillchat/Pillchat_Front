import { FC } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { map } from "lodash";

type TabItem = {
  value: string;
  label: string;
};

interface TabsWithUnderlineProps {
  tabs: TabItem[];
  defaultValue: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

export const TabsWithUnderline: FC<TabsWithUnderlineProps> = ({
  tabs,
  defaultValue,
  className,
  onValueChange,
}) => {
  return (
    <Tabs
      className={className}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <TabsList
        className={
          "inline-flex h-auto min-h-9 w-full flex-wrap items-center justify-start overflow-hidden rounded-none bg-transparent p-0 text-muted-foreground"
        }
      >
        {map(tabs, (tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="relative inline-flex h-auto min-h-9 min-w-0 flex-1 basis-0 items-center justify-center whitespace-normal break-keep rounded-none border-b-2 border-b-transparent bg-transparent px-3 pb-3 pt-2 text-left text-sm font-semibold leading-tight text-foreground shadow-none ring-offset-background transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-brand data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-none sm:px-4 sm:text-base"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
