import { PLOTS, plotHoldingUpgrade } from '../../game/story';
import type { GameState, UpgradeId } from '../../game/types';
import { availableUpgrades, canBuyUpgrade, nextUpgradeCost } from '../../game/upgrades';
import { useContent } from '../ContentContext';
import { formatPrice } from '../format';

interface ShopProps {
  state: GameState;
  onBuy: (upgrade: UpgradeId) => void;
}

/** The supply ledger: one line per purchase, its price as the button beside it. */
export function Shop({ state, onBuy }: ShopProps) {
  const { ui, upgrades, districts, locale } = useContent();
  const offers = availableUpgrades(state);
  if (offers.length === 0) return null;

  return (
    <section className="shop" aria-labelledby="shop-title">
      <h2 id="shop-title">{ui.shopTitle}</h2>
      <ul>
        {offers.map((id) => {
          const price = formatPrice(nextUpgradeCost(state, id) ?? 0, locale);
          const heldBy = plotHoldingUpgrade(state, id);
          return (
            <li key={id} className="shop__item">
              <h3>{upgrades[id].name}</h3>
              <p>{upgrades[id].description}</p>
              {heldBy && (
                <p className="shop__held">{ui.storyHeld(districts[PLOTS[heldBy].district])}</p>
              )}
              <button
                type="button"
                className="price"
                aria-label={`${upgrades[id].name}: ${ui.buyFor(price)}`}
                disabled={!canBuyUpgrade(state, id)}
                onClick={() => {
                  onBuy(id);
                }}
              >
                {price}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
