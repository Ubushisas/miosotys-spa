"use client";

import * as React from "react";

// Create a context for tabs state
const TabsContext = React.createContext();

const Tabs = ({ value, onValueChange, className, children }) => {
  const [activeTab, setActiveTab] = React.useState(value);

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleValueChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-auto items-center justify-center rounded-xl bg-transparent p-1 gap-2 ${className || ""}`}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      ref={ref}
      onClick={() => setActiveTab(value)}
      data-state={isActive ? "active" : "inactive"}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500 hover:data-[state=inactive]:text-gray-700 ${className || ""}`}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab } = React.useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      ref={ref}
      className={`mt-4 focus-visible:outline-none ${className || ""}`}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
