import { RestaurantForm } from "@/components/RestaurantForm";

export default function NewRestaurantPage() {
  return (
    <div>
      <h1 className="mb-1 font-bold text-2xl text-ink">お店を追加</h1>
      <p className="mb-5 text-[13px] text-ink-soft">
        店名だけでも登録できます。あとから編集できます。
      </p>
      <RestaurantForm />
    </div>
  );
}
