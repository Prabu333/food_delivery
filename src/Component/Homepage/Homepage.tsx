import React from "react";
import Slider from "../Slider/Slider";
import FoodPage from "../FoodPage/FoodPage";
import FooterCart from "../Footer/Footer";


interface HomePageProps {
  searchResult: string;
}
const HomePage: React.FC<HomePageProps> = ({ searchResult }) => {
  return (
    <div className="mt-6">
      <Slider />
      <FoodPage searchResult={searchResult}/>
      <FooterCart />
    </div>
  );
};

export default HomePage;
