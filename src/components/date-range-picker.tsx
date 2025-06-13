"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  onDateChange: (range: DateRange | undefined) => void;
  initialDateRange?: DateRange;
}

export function DateRangePicker({
  className,
  onDateChange,
  initialDateRange,
}: DateRangePickerProps) {
  const defaultMonth = initialDateRange?.from || startOfMonth(new Date());
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    return {
      from: startOfCurrentMonth,
      to: endOfCurrentMonth,
    };
  });

  React.useEffect(() => {
    onDateChange(date);
  }, [date, onDateChange]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal sm:w-[300px]", // Ajustado para ser w-full em mobile e 300px em sm+
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            initialFocus
            mode='range'
            defaultMonth={defaultMonth}
            selected={date}
            onSelect={(selectedRange) => {
              // Verifica se as datas realmente mudaram antes de atualizar o estado
              if (
                selectedRange?.from?.getTime() !== date?.from?.getTime() ||
                selectedRange?.to?.getTime() !== date?.to?.getTime()
              ) {
                setDate(selectedRange);
              }
            }}
            numberOfMonths={2}
            locale={ptBR} // Adiciona o locale pt-BR
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
