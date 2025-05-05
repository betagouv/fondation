import { render, screen } from "@testing-library/react";
import SgDashboard from "./SgDashboard";

const renderSgDashboard = () => {
  render(<SgDashboard />);
};

describe("SgDashboard component", () => {
  it("should display the title", async () => {
    renderSgDashboard();

    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Tableau de bord");
  });

  describe("Card content", () => {
    it("should display the card title", () => {
      renderSgDashboard();

      const cardTitle = screen.getByText("Créer une nouvelle transparence");
      expect(cardTitle).toBeInTheDocument();
    });

    it("should display the card description", () => {
      renderSgDashboard();

      const cardDescription = screen.getByText(
        "Renseignez les premières informations à votre disposition concernant une nouvelle transparence.",
      );
      expect(cardDescription).toBeInTheDocument();
    });

    it("should have the correct link", () => {
      renderSgDashboard();

      const cardLink = screen.getByRole("link");
      expect(cardLink).toHaveAttribute("href", "/sg/transparence/creer");
    });
  });
});
